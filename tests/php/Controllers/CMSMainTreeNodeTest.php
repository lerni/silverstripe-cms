<?php

namespace SilverStripe\CMS\Tests\Controllers;

use SilverStripe\CMS\Controllers\CMSMain;
use SilverStripe\CMS\Model\SiteTree;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Control\HTTPRequest;
use ReflectionMethod;

class CMSMainTreeNodeTest extends SapphireTest
{
    protected static $fixture_file = 'CMSTreeTest.yml';

    public function testTreeNodeCustomisationsExposeRovingTabIndexFlags()
    {
        $controller = CMSMain::create();
        $customisations = $this->invokeProtectedMethod($controller, 'getTreeNodeCustomisations');
        $this->assertIsCallable($customisations);
        $page1 = $this->objFromFixture(SiteTree::class, 'page1');
        $page2 = $this->objFromFixture(SiteTree::class, 'page2');
        $page1Data = $customisations($page1);
        $page2Data = $customisations($page2);
        $this->assertArrayHasKey('isCurrentPage', $page1Data);
        $this->assertArrayHasKey('isFirstPage', $page1Data);
        $this->assertArrayHasKey('hasCurrentPage', $page1Data);
        $this->assertArrayHasKey('isCurrentPage', $page2Data);
        $this->assertArrayHasKey('isFirstPage', $page2Data);
        $this->assertArrayHasKey('hasCurrentPage', $page2Data);
        $this->assertTrue($page1Data['isFirstPage']);
        $this->assertFalse($page2Data['isFirstPage']);
        $this->assertFalse($page1Data['hasCurrentPage']);
    }

    public function testTreeNodeCustomisationsCurrentPageTabindexFlags()
    {
        $page1 = $this->objFromFixture(SiteTree::class, 'page1');
        $page2 = $this->objFromFixture(SiteTree::class, 'page2');
        $controller = CMSMain::create();
        $controller->recordID = $page1->ID;
        $customisations = $this->invokeProtectedMethod($controller, 'getTreeNodeCustomisations');
        $page1Data = $customisations($page1);
        $page2Data = $customisations($page2);
        $this->assertTrue($page1Data['isCurrentPage']);
        $this->assertFalse($page2Data['isCurrentPage']);
        $this->assertTrue($page1Data['hasCurrentPage']);
        $this->assertTrue($page2Data['hasCurrentPage']);
    }

    public function testTabindexFlagsWhenNoCurrentRecord()
    {
        $page1 = $this->objFromFixture(SiteTree::class, 'page1');
        $page2 = $this->objFromFixture(SiteTree::class, 'page2');
        $controller = CMSMain::create();
        $request = new HTTPRequest('GET', 'admin/pages');
        $controller->setRequest($request);
        $customisations = $this->invokeProtectedMethod($controller, 'getTreeNodeCustomisations');
        $page1Data = $customisations($page1);
        $page2Data = $customisations($page2);
        $this->assertFalse($page1Data['isCurrentPage']);
        $this->assertFalse($page2Data['isCurrentPage']);
        $this->assertTrue($page1Data['isFirstPage']);
        $this->assertFalse($page2Data['isFirstPage']);
        $this->assertFalse($page1Data['hasCurrentPage']);
        $this->assertFalse($page2Data['hasCurrentPage']);
    }

    protected function invokeProtectedMethod(object $object, string $methodName)
    {
        $method = new ReflectionMethod($object, $methodName);
        $method->setAccessible(true);
        return $method->invoke($object);
    }
}
